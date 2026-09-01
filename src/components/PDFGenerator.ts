import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '../context/DatabaseContext';
import QRCode from 'qrcode';

const FACULTY_SIG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVMAAAC2CAYAAABktW7xAAAiKUlEQVR4nO2dO1QVWRaGj7M6EEOpTK0MOhPDZjIllM4aQstMDMWsMRSzhhDMugjFbK6hmDWEQtaYXTS7GLZmM2szf7kOh32qTr3uq/5vLWZaHnXr1q36z36fa4YQQkhlojiZN8ac/6v6IQghhICZ7D8IIYQQQgghhBBCiJ8oTh7I16jPgxDSPteG8BqdI4oTCUbvGmMe4VvvBv10ecSnRQhpEWbz22HdElLhYRQnayM8H0JIy1BM22FR+d7OCM6DEDIkKKbtcK59M4qTpMlC4ShObjd1vGkgipN1fC2M+lxI96CYtsOx5/t/NnHwKE4k/vq3MeYsipOVJo456URxsm+M+QNf70Z9PqR7UEzb4dD3g7qxU1ijktzKWK1zvCniN+u/b0VxMjvCcyEdhGLaDv/k/GynpnsuoYJb1r87XyWglJ99YnsfGTYU03Yosop2a8T17jj/vl7xONPEkvNvWqVk6FBMhxszzXhojNmr6Ir2PFNrKhPFSRrFyX+jONkyk4kbN75pjLkxonMhHYVi2gKDfirZ/O2cX/lgjDktCAf4jt1TEix1k1BZTeyzSYs1ImQyp/yo8+EPMlwopi0x6KfrnqzyW4jf2qCffqt4+A3n37M1u7XchWCSXfwMlo2RoUIxbRc7657xXgSrjmgN+qmEEb5a31p1RbEEIvoZJ2bEyPuQMqcoTs6jONGuX0iDRN73CWkFimm77mfqfn/QT0MEIgQJE2TcqmKdIgv+0vrWGzN69lDmJHHPJ4jnqgsFvu8TzapWPyGV+Knan5EAIT1TfnTScC3rL467e0W8S1ilMoxls+rJIAm2BlEXy/nNoJ9+LnmMxKkXzeK5u57aXfn9u57DadefkNagmDYMROVgCC/lWqIrZcQUnVNSVZBRymJG5n8Zf3emWLV/RHEii8cjhCVC8CWN/ori5I4tzkiU5c07kGaGxtp3CSmCbn6DwG0+cIrqbXxWVBVc99YWxhBsoTlBlUAQ6OJ6hiz6HznhAXm/H9H+GmLNu1apjVsdUVTGdZ2zZMkwoZg2BATjvSOkH5Tfu92Q9TtX9dhRnGw44ls2PFA2ufOfKE6KQghFP/8tipNF6/3bIw4NEnJfcsIYrXzmsrCELBZk+qGY1kTcTZlUJIKhlEA9c7LuTSVGfP39s4FWpZ102hv007LF+nlNAuLaHynf/903lAUW5COnHXRJiTFvYMHQRDJV4qoP27BOIaLn+Mx3sFjIoBXSYSimNYBFMoCraxwxUGOFdes4YZWJSGuEHNuOMx4pNash5C0Icm4ims+Vn71xrWdlcIuwO+inB8q5PcTvPlGOfex5//sNLZgLGO93DBGVagPXcmZta4dhAqoCyDpvemKj4tpvWAX5h7ZLLWI46Kd2WZNp0MUWofVm0JV20aRCxj2vHOkDRFDYgrg8U2KfK1YSaU8JWWTX5yOu5/2C2PARkmCaxXxTLOJBP92vsFCKVXvPeX0fcp6T1vBAGoRiGgiEYRVCYJck2dbo5qCfuvHH1BGAutOM8sRUXOMLMUN8UZoDLoQJoQhb2FYrivpyznCVDbcLDO7wSzf2OeinsshsKUL1PEuGidAjNHDoaRnNkNeQxauH/3Y9hTeh+51hAM2LgmSYjSwG6xPYOUYahhvqFVthq3joXbfO5pUIhq89VIaIWP98rAhu6PmIJXeacy4nsKYSS1BE5L85lQSvBv10o8YQZlVoBv1UvZ/QyWS75l8QI32nCHPkChNCGzIMW+MtEn8H1sKxrMSwb+R8PnJdZfFZURJbPr7LtcaiQAgt05yHSyy53wN+/ShAmGxXtVQ9qMO8I6SfMB0pCzfcxfHt8X5zFc43jyqZ6w1HTOV8dxUh/aJZeCKSUZzcQGjFtq7FgtxyRVIs2yhOXjgWcWLHZi033hd/zuMF4rq0RskPKKZXXbxFPLQ3C6ySFHG6EGFMLTEtWw9q42axNyGwvzsJpryJVcH1pB6881N9sUkRnShOth3h0tx2W/zcY3zD+5fQwe2AWO+WczwZyi2Wqwjgct5r5fAOn6UcZzGKk7MSDQlkyum0m2+V2SwFFNR/Qextv6xrB5GWZErGvyscw3VdX0j7J97DsSP+z/G+fM0D96qIAMIeeWMDXw/6qVq2hdhnUe9/pfPyAfHMi7WG8gGLlAj6giPEknRjcwDpbmkUEjR7sJbuFlgjIn5iDa1XjJGd1ikmh4hdKR+S/4GF5ha8y++veOo9Dd53aQJGBp7VtIjrVDm4k6fSBoRUFtDXuEe+IVTgWrT3WbRPOuvmw5rr5bjyEovcx7i82n32IkJRfKlNfLmCkNpW5pITr0udDPY8rNasd95NGN2VRNKgnza9s2lacA1e5cShv9aY7+p6GmXioCdIYGUWscTL5Zpn1/eG1efvs/S53xTpppgaY54WZMQl9teIleQI9FyFfZs2nQzza1fgEZO88ocQ3BWURbnlQlKiJD9fbOi9vguIY4pVt+KxGKsm5bIwSlJCRN/Cbb8QUHthQvJxHue5miOgdghgGINtyJjTVTFdc1y5FcQCZbO60xaEVCgdv0NzgCsQVxInylYjl/4t7aKwcN2/lQXl7yhOnoe0lBZsAljoxsM6XYTV79aXlhIkxGDXPTW/efzqG+oSKMpH+CzlGkvIh1l90k0xRc2ibZXesorb28zMlnJhITpunHRPs/5gmX63LN4rW3nA7TeeLPYfEJINn3UJMda2YSn1/nCuItyL1vk+DZ1aZV2XooThNj7PNQjuJ2wVc0m0LUvUHf6icTFvoWzXGOkGnRNTT5JEsrGnI3jdPMFPnXCAWNB51uOpLTAifkr9pQjqLkIHbn/7I2x/ctP9O5yPr30247BCF9dbDJHObfXE6y/CEr0bUAOaWoJ3MalfeU8P8LshraKZOEuHG61QotLJ0iinIymz+FodJAyL6i/7W9qDCQtw37GSPsCq8gp+FCffLPGVwvzcMXk5pUrfYc1lpVyLEJ08IS3VUYXwRYKC+17BOb4IENAjXLPC6f5IUrlxaB/vrEQkrVGSS1fF9LMjDt8H/XRmyCL+syaOSuvlXshOpkgm3bQy4yHj+B7g+EVJFs1KkwEgCxDEytudeM4rq0LIO69PCEsEDzDB+MG86fz2+5P3RQElwXTRzTdK4fn1BqY5lUUssw1laLPrfl9pl/RgT6e6GfJ+JH6YxUoDM+FfG8z++8R9vSB2eQIR7ZUcXJI3oEV4BcuWHU2kEl0VU02c5GErOyS5LHaPvgxL3spcfQipmxzaLvFwnzoiJO55oejh9aVFUyy8tRz3t/JwFB8Iaczj2q/muPMfEJLohVqLCCXkxVglnNHDgBoKKKlNV9182yUemquvtIReuPDW9sZ14pDusWVoSKVhxUj4iEV3MaWqicYFT4Ltl6aSPtY5LxfEQ7/Csm1qy21COi2mbgKqcExbi6/9WnHtvT3uJY+txmVHhbUddFFIQRaXrSKLEWGBzRK1ppw9Slqjq26+hrtXU1t8cRIrrpA+D0yShFCYhGoT1HA+gAsfMmz5Q1GGH8cV932jYLKXfcyPCBGwU4m0xk8dFk73QUzbtkpBz7OHUTYJqsm4rT2pamggFroMNz2kUuBXlB99a3AK/lvswzWMz5SQzoppokxiH7U7/KFmf7oImN0FJYhlONTyHpQfbQfMH3iL2OVp4G4HIQX7H1DV8LHsnk+E1KWTYopJ7D+jljHLrssD22pSAkkin1UqIlA5loe+d1fA7g1LTFFgvxkwf2AVLve3hnY7eA2vgtuHkJHSSTG1tsLoWWJ6v8oulqEgWbKf02mz04JLGtzCWrGjaw1zAGZzLNETlDUdB7ryISL6BT3ytD7J2NBZMQWHjmss2d5GH1C0LyaI9fkERzaDa8OClFmcbYjoSkBGfhvvqxcgngsYi1gUC83mExS2jRIybDotpuIaRnGyYwmDdELNNlU6Y1lZRcKTtxVIGdwyKwkrHDa0IGSF9UWDQb7j/e7nXUcU1Rft+mr33suou8oxZULaptNiCtwdL/Pc8bJCulVi6+AmSB0xvdRlVQZkzstsPPcFr5/bkgnLdjNAlLPdDiS+yngoGXs6L6aYr2m3edZ2H62RdZrb+hiCbYvsUkPJr4+IUdpZbxHEYIsO2fMkMCP/HfWevYCs/BrO5WETtaaEjBudF1OwggEetR9giNGWRzQei6uK37HFNKRuMjSj/8ipL50pmZEPqQ3dLiqCx3uUmO1CQJfSRe89WzzJJNPJdtK2yOk5fwtr69C3ZfKgnzb2WcCVTrENy0LBHNRsq46nBZboEazQw4CMfJbpf1Q0Qi+kTIqQSYBi2iDKPu0Xg5a1xInyu63PBVCSSi9y6l4zi3EjNGaJpFK2TUgejU+gImTU0M1vziI9UNzjZx4hnXeE9GRYQho4M/Rir/gAC3TGsmqLupPeISPPWCiZSiimzZB64oy+mKK7X32rAmNl5vNqXQ2SV49C5ntGcbIZ0J0kcGo96QQU0/qu8oGnhXLbsy3JvFJu1KiYWv3sSeCGcRfNCiFWI4R5MyAr725sR8hUQzGtCETlY05yxTf9yf3+1ybrKEvu67SNmOi3wLkCawUiKq58r6hgn5BphGJanYO82kvNIkOW2xUjiV/WBsdeDyizOoHgidV4GlgutVvQqcT9k0jnoZhWAFaaT1zUARwICbh1lKt1hnUgZCBfKwFlSLsQ0PMSFu5qQbb/KWtDCfk/FNOSQBR9HUUfcsTlyHG9H1cVUrSqZmVIcwUW48vQSgEcd7lgdqgM1pb3SEuUEAuKaXm+5VilMmrOV895yymFKjW0A0KXufJFSaXXCDWcB1qg0s76oKA+9BMSTzJGj0klQhwoptV6+b0/t6dOwQ3fUFzwoOEn+PsZDHkuysxnSa8y2yGHlDe9xqxVWqGE5MAOqAp49rjXxG3WsWJP0BF1GGgxvg84naCdPCsMYA7aVoQQ8n9omVZg0E83ozhZKrAU5xTRU7P8HsQazeNiF9MynVOwdFeQWLqbM0rvDD34FFJCAqGYVmelxLzSKllvib9uWh1Lkvj5Bmu11N7vsHK3CwR0C8cWARXLlXWihJSAbn5z3Ua7TqumiF9at5USQnha5RgBO4WeoFyqye2lCekkFNMGgfCJ9Xg2yox3wDR7KdPa5NARQpqDYjpFQESTnEJ77qVESEtQTKeAgLF6e2XjrISQclBMJ5icOlY7sfQob3sRQkgzUEwnlIIBJB9QNlV7l1VCSBgU08mzRNdy9ms6Qnaew0cIGTIU08mxQl946kTFld9BCRY3piNkRLBofzJIFCGVpJK0pR6wU4mQ0UMxnQw+W4OnU7jyjU3nJ4TUh2I6GUiH0iFmiNKVJ4QQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQggh08K1UZ8AGR1RnDwwxqwaY86NMTuDfvp51OdEyKRCMe0oUZwsGGMOjDE38a0TY8xDCioh1fip4t+RIRHFyZoxZhnW4/qgn8r/N8GiJaTCXXxv33SAKE5mcF1n8XXHGHMb1+DUGLM56Ke9UZ8nmRwopmNMFCfyYO9Y33rUhDcRxcm8MWZb+ZF8f6qJ4kQE84Ux5knOr/1ijPlPFCd7g36aDPH0yATzr1GfAMlFxPQSUZyIa16XDWPMddMxsIjsFQipzSPElQkZrmWKVV9cJrlpJfZ2Puinp9bPZwb99FuTrznliIvvcr+B6+iLix6b6bbydxHOKMO2CGoWXsFxtowxh7Io8X4muWKKeFLm8snNMgORzB7EM/z3PGJN8v+JdqNGcaL9+9Wgn4p1RDxEcSLXe87z4xv4XKoioYPfle9/NFMIrMt9J0Zs88EY8w/uY/eayz29KQsbPpM1hAHkS2KqTXgKZBrFFFneo5bdwN+jOHk/6Ke8EctZpcLXBpJQ9zzfF7H4PGVu/boxZkUR0lewLuU+/AYDYklipcqhLgwJue5RnIjxkCGWAe9h4rVMky7G08YQn2CKi1kXWTBdPg366dS4+TAKdmFBujwd9FP52Q/grveiOPlijLmFb3+BtZ5avyoCfB//vRrFyemgn4rlOjYgFLGBhfEZQxGjS0DJ6lyFr7j5nhtjfsXXK2SN5eu1MeYdXCq5mbmi54CH/ZPyI/vBrkra0nHHiWWPkD53hVQJgXzHvSsW7YpdIoXwlHhuBkbHPNz/cRJSebYeItH2D3IZZASWqRaglxvrFNbSbbiJs1i1xZo5tRNNFqzTq4dcv2fO92rXmUphfhQnJ85nPW3WixauEBF8k/dHYmVGcbJbEEp5YNX+fm6w9rcJazxVPMuzKE7+PeinYlWTYYhpFCeau7I66KedKOSehNIoJPy0hassp46Yjo111RASA3WZR/IulyJxhNs88mfCrupAzPedFaJw+SuKkxt0+VsWU7gpx8oH8ZbW5UjR3NSmcOOmks2eJjQrTJJQf0dx8njQTyc6rBHFieQ21qM4kfeZwlL2CWmGhI3o8rccM931fBBnXMnGC084pRSwYtwSoCas3bEByTTpdNL4M4oTyeCLAI0EfAZ12IBn8QQGj1bq5nIrihMaRy2LaVY36pIXqCftI906l2go2aEdwy758QqAJDgkpugJCY0VyLJL4lPjOlpGh+auy2cXxclGFCfnSAz9V6oBKoq6/Xlp9bNvketweQirljTMv5Dpe9qWFURqoXkFTbhpWp3pA9RlXiD3hSQ0IJ7LEE+Jyf0Fa0hqhSXbPdYM+uka3q9WGSH8NgxBhYANjDEvHfGbg6iXNVzyyhcl0baGygNNUP8s+VokMGYqrhDrSieHJixTrd/8Icp8ziE+IffElSlTEFi5p0SY30vd8qiz3XD55b1tKdURmaCK4bAYcq6ZJRk6VQouva8JI+MJrv1W0TkEhAg2rGO81EIA8h44Fat5N18r4L5gnOrnugY8Bk30jhtorfS5eXNIeoUurlqt8BvE8q5DoAfjch8N+uk66qCljlR776eB5Uf/gTUpxwthVkkmfkdtts3vuF51LOVLNdzIeWgTwiY6ATeuYpp3UR+MQaC9q9zL6c0vhViLUZykUZwcw1r09aiX5VyZvTrWsfdBPxXr9LZHYG5KHLNEiKTI2sxwFy957QWchzS3SM2vZimrQCC1BUHY9ywi2nvls9kgP0k3CPqN1xWLZL5mJ4aIsQTdZWWWm+MgtHAYltkdd/JUG+BcsyHBcuPPoPNllH3qqqsX4AJmTRUZK5iDGoJ0p8m1PsTXLJKT8v/LcBltzgK750Qcbo/LFH9cQykr6iHJd6mSBYIaUpM5J5ZqQBvukpMY2rQ+R2lhPYdRM+ccezHneXHrhIV3OffHqtKwUHdgDnHrTCVQjQ/0D1MDiOY6VmzV+oni5EVeLzNWy007thXFybZnda0F4nu+jpiztrZ1wXuUm/ufJhsirMLtsmPmxN1cznlwpWNKayA4L7H4inU61FIkJH3EAjzW6krhDkuibc0Zwm1wHTXPzA2LyYJfJKZ20jB1BU+uexQnnxVPRAwd31YyWiLSa6jIfRbFyXfHYJLndSy6t6atN19z90OC8ZLxTbDKDxD3yXMjX3qOIwmCDRSPu0mCZ00P6fUI6Vc7jlX0mvJzKZpGictBidjgO2RU35QtMbIz7h40If2K13zuye7uBngMVzqHFMvNV2JnED8dZgnSf3GNn6GuVCY+qZUQ6NV/pcyN1a71YoWxhXesz+HK7+O+yYanuJ+lL76tPWNFCSX3ufLmS0gNMfW4B59z6g0lDneMm+PPgIclG4TyWBFREfK/fUJrrdIzDVosmkWajWvbw5fXLYXQvrcSC/dDYmhYMOwHR7P4BJ8wex8AT7Lh3qCfzg766TLihW+UeFtIGMU9z2zYh824DK9JPOJzpW63wJjQPk93ASlsT7Wur8/I8N0Dav0vnoOviotfZCG7Px+LxODU9eZ7rLBle7WzhuPmiV7GFzy4EiftVXCzXeZQclNrqDTEzD1/SQA8sm7GEFHYLlv4jvf7MtD69wlz7sMr4RAscouY1ak9YG5sPMTVc9tNryw0ItawtEddaudbdL0tsxKXdweZS2Zc7hfHArdH8Mls2ZCF6Nx5ptyEnM8DktpY3/FvVhD1j4FzbUnNQSfzntq3Q9wMIYkMWS1FOPeLathQq+cTUrF6snpHOznwoAGL1BWz3BhuDtqqXuTy7ZV48H2WfmEPPeKDvioN7QHKc88zes7n7/ubl57F1pd9bgOfhZYGfD72e7yuJGlsYbwRuIVMagnwjsRHs+fD2iXVRcIy+/B+XLRn9X5RMgxDsO1pYU9KVCSQBvaAKuqWEOE7zLNAXTwB/+xYm7iBbkA49i1hqZx5tBJbuUOCS7CmTGU/KHh9zWIr+57qumba34dYV+5D6ntofdZOiDfTCHIfKlZmiAV+qBgM7mJnLyIX80yLElCyuMEjyhJMUqOaGR8+11+29fZ9Lr64eUgy7MyOqxdUDJCKYlpmKLT0O+9UmcwOV3dHEVHZtMwWlmy0WGHPeCCJY+W+riGk2QNrr/JHFUu4fAuQm3nNyDaGq4pmURaWyChu8JVkDhI2v3n+fti9/K+Uzp+svtOHFiN3r8txBQEzsD4lL2DjE9K3Fe+lmQqLqXxmFNOGs/m+m+wtxFMywTJg9pr0O1cU0kXF1c3Kcr55QgF3AwP1RbxwgvVNuDe2oDQtFr6QSmjNaBnLdKZEHWrGS7s33xpMPBZ4Nmy8WzDkw702J0oZ02mVkAX+bklJHGkUCalP/EJEcSxqfafdMvVZgGkTPbxwc7Up4Hm9224s6XqN4m/bKq1dswohuRkaL0W8yoQKGeoC3Rhe9tqSnS9dH4gEouuBHJW4nnbsz6C0y4wxL5TwgpRJLVrCM4vPYFGJU2vxSuPcw8GDZ1DXKmVbazg33/zRovI3zYvYC/wcbzfVmEP8lqlvNQxJToSQKEXJTysIde3C77odVVryLPBGPgqNgUL4fBna0m4ZBKSnuOHBIQMktsRTKc0o+vMRWtAmoj1BLuBPNKq89CT8QhoqSr8vCS8N+qkYBdIUErnlgkUCh4X0tSOkVVc1JqBaEFOfZdVUh4R0/NhlU78GxCy1m6qpGGodi1TbDrjqjXucY8Wr8Ue0GobUtM6gsWAfo/N+qbtYDvrpSkVBHUlNI+6xvBF8PpZyEjNy/zZSWwthPCv7zCFMJX39d0oKaU/p0aegtrQ7aVviZbuHzwItUq0rZGTba6AWVy38DpztuRgoMnYFg48ddF/ddjp/ZPao1Ht+xrV6nyPKlWoNIai+ocsnyuCOkbqTEt8f9NN5JKXyYpYneF/S6JAnku+tsromkjfzVRY4eYYqhLx6nnupTj6CBMZMH7SQ7evVcAtrWzhVykHg2m/lFKTfy3MLkfjQysESO3EjbanKIiJZ6M/K7IRfsPPkEUICZXvyhUoPkVhGUZw8g8cxg9f/mNPQcKkBZBRgBsUOzmXZKr+Te6FXIqkq98FhnWoQeB/3YIW6Ytpmv7wvxMW9oWryY5BHzuixLxLfqftC1vG/D/ppYfYYk8cltnUFxJrKvv5nK+BfasdVzK3MOnvEXdyFcMxbAul9XxDSPwtcygPP8GIp4VqzBL1qiEFc0w08TFuOyx+Juwkrd77AKrtE9jdYFJbyNnWr8rlNI8798A7Xb66hGGjo/ZwtzFKZIF1eck+QGlyzrEAZUuJD4jKfGxLTT3C58n53XqnJs7lXtjQLccPfrDq+XLfcmhh/13ED12yr1lmELkTROU6oALr72F8SUueYm4EbqH2H2GeWV1a7u4gYasavqJtdgKX5MWSxQdhjs8QuqqU/t2kj8LNrZUoaGU7MdLZE8qguIQOPi1Zl366Tebx05mv6suiy51HPmhjv7qtzmFN7+T6bcYBpWqkipL6YnSukz321sOKuwsrTBgtn5yQCKa2O0kkj7b0/ymmU93Dx4FpCdy8gqdVzBr2EMNLk4aiBRegK6Z5St8rtRCZYTItiNE2Mv/vx0OdtywCrqWjlzkuoqEAojpwpVHbyRuZabsBic5M/rzEsWouzuoL3HtbqR6VGdA9u9DXPKDyDB+tOiNuFBMQCGinsL+kmK/NA3rcWF7FOZVjKlRI0LBRHEFEtQbYHIY48HXWdneyOa+fGvCW2nCpJVXYkTaqYojyjbOlIWVLHMpSBw5dEGg+wFq977pbjwCUtxaCfLlplLSLI78TCwpSlM6XA+zWEbc0X5kDN6r8DXl4yvz8aFNCh89ixVMWiFCEcRpeKmyRKIKgPrW2Qf4gfPqt9T5LrCCGOBJlz2R3hwCkhMh0fRKx5W8e4JucVJkCRMc7mJ0isaA9LEw/BG2dlvgUr7hMe0hVPCOB1ZqU58cntihbzRQYc/33X836vxEbzwKT0G9Y0+SyzLaIoYnvqmfR+Md2pakdTTXadZNcfiuUoIY9jfDbbnkqGi8SWJ2n13rHOO7lFBhYirQ34LLs/nHv/dscXnskWUwhCry0xFWsripN7cAXt15jzuPVipfUcd/eplT2/X6XECVbfNcSvRPjmISLSGirCLjHG0jErxCQrZWBHsRWyZ36na5nfwzXStkfOPiP5PHxJJVc8F7rmwsK6X1cW651sAYrixL1OHNo8BSP4fLHKRja0Q9xSEjPygG4qwv0VYqYOzMDmf3at5l9V94eCSHe9HGQ7RyiFjYItaJ4VZOd7Tnlb3YlXk8iSEl9+VlB+Rqt0kjugCqbpNJpdzBInVqLisbW9RtHkoZ+V/aE4rKECAYtQnpDKRKWQ2Zk2XfycbivX7aDAEu1kOGTaJ+1f0FZCBO5tqd5mJHyuQfyzrTla3Qp6ytG2AA4hZNizW2JVpoxqWnDLwc6U6fyumHa26mFaxLSp6VBDoWBrDhIIRv39jJCHPNTZ/lFa7HwPycKPgQvsFXc1cJuPaeZUef/ute7y9ZkKMfW6bCPKNpMhAcv+R10pmg20eLZUOJR50K+0IXdQSN0a0iIvSpJTfNYmfKvnvCwrJ8p0i3ue+GnZDiZmpQu2hrYbRybRQyT+EXy+faBKF8iTicY3faqsxcQtMooXGHeBkmlUtEwnXUxzyjVoYRBToUmConD1ms0UuP1dKx2b6uHQ2tYanR5QQS7t+VRmYfXtodQJMGfCrTFdclz7WWfcJRegKRJTumYkjzqNDvaErS6g1W7POHFUuyTROwuWTKaYatZEp1oASe4eT2W2mnZHN+bu4DpNwIJ/4imNsq3PS5Y+tw+ZLjFNlZIYimm3yC3I18bzKb+zoOwu0KXmCt9eZa4b7zbLMD8xLWKKOkAZeZdZKDJ/k2LaIdAmqu3jFJQkgVWmDfAO3ipm0sFzpF2DGwXzcCmmEwr35CFeMM3oepmtbDAnoaeMU5SJXAtdK9pXrqFcB5l2du7Ze63U/mRkfKdGEfID2fYE80y1utPtKE7eWG7r04IdELa6JqRWaZS935YsMhIX7Xnio0wATyi0TIkJcNmPa2aaHwdMA5talF1nP8G9X3LGXn6F9U5BnUAopqSQgK2qfcgU/kdlto6eVhR3/qsy4rDVLZ6JaZX/ARoBXukDkhGQAAAAAElFTkSuQmCC";
const HOD_SIG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAACdCAYAAACZ6LXiAAAe/ElEQVR4nO1dO1QUWde9ugyE0K5MrAy+TAntyYRQzMTQmgwM6cnEUMwGQzCzCMFsIBQzMQSzgazVrCEEsv9fB3fNulzusx7dVdVnr8U49KOqqLrntc/j3hItQxQnj4QQb4QQx0KIt4N+ejHqa2IwRoVbokWI4qQjhNgRQjyRXn426Ke7I7wsRg0RxcmcEGKy7WujbQI+I4T41/A2CzrjClGcLAohtn//JsSgn7ZKDmTcFu3CguW91SFeB6Pe6GkMQyvRNgEnF92EiyhOpoZ4LYz6hnGPxZigbQL+2fD6JyHE7qCf/hzy9TDqh0T5/f2gnxIh20rcEe2CiTHfHvRTIt8YzcyKbAkhHgoh3g36adFQ62/p/y/bHrq1zYKTJv6lvHZC1ntE18MoToYdQrgJr/Fa3uMtKy/ttj2N2jYBnxBC3FdeS9v+ENsA4kdksiuKk67MdEvYznn8CSHEhvLyimg52ibgs5rX2HrXHLCsPyjFGcXJzyhOiOX+avn8Yglr42QcOJnbLWNHVQKF0PqH2AKsSf9/X4mTdciT1lpWfj8QY4DWCDge4HP1xUE/PR3N5TQfcGuDvxPFyXoUJ2tRnCSe57gXeJoECt33mtaFEC+Vl8eCdL3dIqb1leatszyLlPFf8cdeFCcHvsKEe72H2Pa1EOJjFCdpgPU2gY4pY9pR86C68ysBKdVWodECDmuxigWgkmsClkEXlzPcWEdN/2ONe2tCV+kDILx0FBi5iC5qHErwr4zEs958W/PW93EhXhsr4Hh4+9QxZhBuwjchxLmol0KqfVkkuddCiKfSS0eeX503vK5Vsp7e1Q7CrE3ldfIQjIBS+Wx4e2yI19sVLGDv2KjAebp4eK6Sw/VBP/VdnJWBhDqKk00oG5kprh2iONnVCI9vmGN69sSQ3wCsqFq3oH7mOCeXsmU5ZqHiFuIWwDPYeh/aJeCwTGRRB1Gc/B9it1KrhDICR5NCoYf5gCqdpNfOasSUkjAvqUxxFCenw7DopBCjONmJ4mTf5i7jWmTLnWHS81TaBe9QsrY1QiXGMq4pA5OAYd09CfQyfO8jKZqPCC3+8eAYWmPBdxWLSv//FsJeWNCx+LY0MduHQT9NkNM8VxblSBl0KCQieUx523uw6PtVeT5gsr8iw0CL3iZspmugcMgHplDJBlsIpRamLLuYcIRuFLbpsDXop2SEgklc8rpwH1XGX2Xn2yfguKnEbJpAgn4BtjvkuB06Nlkf9HmrabBXg34qP3RZoO8GWJ7Sgb/1BCSPKw30BJ7Pusf9SGH5U0/hJmsjw3YtpqYLX0V5abiOjkVpb/tej6af/658bBgSGzu+LgKB+3xoUV7WEKMtzSYUE7tAAncYxckn3OgfWSURHhIdI3NXyY00uYsCgkNW+8CxELujIFTgOqY58rsrZM0tgylS6Z4QOz0/6KdTBvKqZ7BkxgVJcS6ej6pIfRnnt4ZzkrLTWU5bbP/JUGn2TuEIDnC/uxbLnQ388OJjsB57LiIP63BhHATcdmNVPM8WUBQ7Mx06/DXopyZNrC7EmRGVXaquZQi0hBSEVlV49xETTmVpH4/zu9JSBxoB981EmNzfV4b3bM9n17LWZMGbtkzxkcM4L0UPb/FGwZQCChVXdQoIBDCFZC/QxdhrtIAX6e4JALl+Lz1aPs9zeBalAS5xHuEmq0pK69RiZYhE1IG8BGLl15GOci1O10Lv5HXRyaOK4uSDQigKyzUZ+7AH/VQbgpAiM3gZJnxRwjgt4AX843E88pr2DQp4TVGg5JHR3DffOoJaWvCOQzB38ZlHni7rN1iRSQjsbgAxolrwoZFsUHRqvOuLY4tX8l+6yOLx3Av0omzQWWvvYiFazFGcLOk4CVV50e9RnOxZQjETVj0F/Pugn85Z4v9FGAHX+S8xoXfN8uzfG+L0pShOVkZVWFOGgJ864u636oMFAUU3+AIuaZbrLHQTYEEucV7XtZUGpJ582xi/afL3vuTjXx6NGKpnEMps72qUReh91FlY4l8eaNxabTMQWUTTeoCyc1nx9zr3GM9qAQKZrRNTfL0M5atzxRegaJzjn0ZZNVe1BSesqUQEBL6qApQfEqMfxNoXgFpGqRO0VVzbrGZReJFxZOVhxX2E/D08IVnx/HItNljVM+WavKsBobxNgvcjipM/oIhJwacWAZk11THAHT7Adb3QCOqswagknj3gWp7HQV6KsvPuTbDgIof7lRt4AHK6bhhVdbQQbrikiqCtSZVYWbHJisrc+lRrQcg3QFypgv4J3tAh8RU4j2zFtQSewYq/VBbpWkkE41dPctV6LyQBpKoycrO74DBSJX27FejF3FAOulHLFtD5NjUZnsYKeG2K9kHAyAu60jJV5F1NFuEX3jvWWEAduUSWwasgCFaYBH1VsrQ35r6Ta0kVhZJFzZtVeKKLoTPAGm9qqsee4V8f8uoabIMQVS8EwnSQQxhVkOdy7bxQEmserjjVZKj18q0QcGfbHWnYEWk0X4sVBORJdT3GstVOsVjIMvsoQbJ+oRV/9zyew3FIKABXVudWUgx9g0G2sM9/SgrnFmrxlwycxKwjHnYCVnzNUqJqylwcIsTKqvzmIdRdD6E+gbUOLqBpjIDDarrIH9KowxLwzhD2PTPFmETwLSqWVEci6SrsgopilKpAGj9U2JPCMU1sMOFzFCf0/jrSdiaBuqEIkCpaxjnIlf5pURIvAq4560H3FewbMTZqCSjkSTy8jS2EXI0YtVxKoQviQpuAD7Mn+27Zwo4FuO4oxz2DcPuk9MoYQuFL3nR82Gn8jTselnTFQVRp88QZdG4+KUTyDkDG2ir51Gte86g2y6z1NgZw/nd+cBQzEGyfmvLGbX9V5lz0NxZ2cVRNH2QJclUSwTJk5FI2ttfVmpo3X5+dcybAMsglqraae1XJTarnR+vq3wYXdsHTOv6CgsvlqeHeOe8f3OfMpfZ5/geKtzAD97vn+VwJX1Bo1bj5fqUJOBUBRHFCi3NT425O2fKaJeNEsrT3C7iq6tADF45L4Aa6AcdZyOmpULi0qQjM3xpv5DEW9LpBAch4YyoCKQu4zj3PWP0NFO6Fo/HGhT0UWtWOPBvJziZIzexrCKhZLN7gVr0cOJJd6RCrCPKMBKDncMdV0I4bIUP8TOy+73WqDSZEFJmgfnaDOqTAncwZyLlF2VohXiVBnwIzPwXysOosRQeKbNmD8LqEQj6Q6vJn8P1egLI/QYxd6z7vkW1dhI6kTUXA70LIhyHgU5rfjz1Z2J6GQCNrtoYfnfU4C60/N5WdBri3DxSrbbMwxxrh+GaY3JJZY+1zyoQe/1bmruJZrAdsEriHz9M1LURxMotnedfzu6TQapPubcLeZLqYu/KiEwOsPeGOOuJMeEjwSCC6ms9di/ECoFaLhVi1Zem7Zw4LrkvnPTTEnx+qdrU9QqMdD+8pE+gDKDtXH7hqoem7R3UpRmmigP9QFvDZEIcfHiianxbNNeYTLiYRMHKhiAnnKK0koVrUWOvdnARe3mEUm5KXcYm++CNH6amuw0vXfz30ric8iwcG70kn2JtQaGRxZwNy35eaFGbrUYmAI74jTZxAs2badhjYV9I4p7B6554LYgvCNwH3dl8KPXSufl7X7ob76OIL4G3IQvDWZ8Giw+uHJcvx5zBjTii4EOHMiDNaU3MeKUv1e7t1GL7Zqu2DsaiyyS3DjG/U8IAWUrat0bTFbet5CIuaz/+QsyRyPjQ/jrJUNeWXBmY59mEByT3/DqY5HaKVzkiv555ptxQGIpvW4tvkMbS/baz3Bx9RtY8aCiw5FtB2Ae2+Eaq8JKZe+PAUlrLYs9DYHzHnsDrs5OufD8g7f5E672ZQYeZSCGdQXLvjEFfXRsBHhJmCY59CGPo85FpWPaXDtVQiXNljA08wjEk6RSz2LJRJz5NMPJFIM+POosPOvzcdbRTweQvJso2dMvISLT9LKDmdxyLWsehdpSBIVzSUdS4NI+UYBOTVFzx7rn9BoGdg2ac94uotxOGHTawqGwVaI+Cwdm8MLvkJ3D6qcy5SNqtacHI/vReaUhF2hlhRdlufYsET89011Ee/q1tlFdxwW+usjPfwSmY9mH15nnmuCZ3jjlYIOIRhx5LLvqpzLmErYdPgQydAkskk0QGu+aOmCGXDICwk3KXuFlOCK25SqiYsBDDgeUMpRlsE3HOKCBWjnFZA4E16Fm/0FGt8hrG7ZKlXlQV/1yDcX0Yt3BJBmARUmamwCfd3hFFjm9YqG3cabrWzlM+wBj+oWYGpHO2Me5lw4/dNzxlrPu5vJQicRfYLqa0ZTyVwNfkmsJaf0VYBlxoQPmri7AeG+uPcrrVDwLPQwGdGdjYz7aWcWvPopc/Y4qFaNKkYZTGANDsEj+DTW71Vl91f24xGCbhl9tfVThMgvRY0lua8IgG/sdUQ4tJNTatpNltblzf/w8Ah0Dij3awar6Qww1ewQ5o9BK7d1rH1CZZ9vynTUNqAW6JZwr2jcclp4SzLi1/jGr8oywWk3VI1L5PbfWyZ40Xx85ynd5LNjD+CRbzyPqoSCqkuPuvgCmmTdeE7ng0Xn4wIdxok3LuaxUelorpdIw4r3KPslYbUe2oZDuE9bRNKSp1sUrW1m/cd4B+Aq2o0FuzRo/YCjgaLLSW29q0dD5rr7QMSVswvc0172YP1+llThblcMnGX9c3TMImR7svOaIiAa3LHvoPlO1X2og/66YJjF8qhdmf5ILBFVgT2Vu/WUZExaizg6ERbUXPHcFmt6SlNfrp0izLop4uw5ItSeewGlM9pzdKJuyUK9XdJqGvzdzIaJOAgyVYMk1VOPQpMfHYSKQyECLUcIICy2DKsNVnpHTDgNAWFhbpBqJ2AG4pDLuFm+w76U93FYU2TqUNs3QssHTXhaoMDdr2bjTs17EbSDQI8RQeRbwfVeZ12eKwaOUcCm8AMeItwp2YkEFkNHdLADirVhX84rEKRESjE9wED/E2ggpoUNftcWdYi1EbAwY6bFqptaqgON6xPW4TbY380X2T7h++2dWQwoyaVbFi0RiEe9NNbBSvOvg36KbHJjQM8G+IlFkogzC6Rm69VCo/RfgtuY8Vp59I8qSEZjXQ7AzbXc+EdwhyuAR8z1EXAFy2TPPI0/Kvxei1TWZo69AnUns8FzDKzxdXEgnMb5hjjTk3c8xVDQUUvp/VWY/nTBrjh81B0IRseFqp9Z7QfIxdwTAfRgVor8wjmI82OHQc1ZsETCHeunVAV0ozSW0yYMeoh4GhVLHtSiWr1fYflN5EJf4cKs/921GQwaiPg2OLI9Da9sZOj4GNaGdp3VDOL7TPI38aCb2D0cy29Eka9cKsGpZX/Wj7yftBPe3mPlSe9VoGH8gopLt89uEyYr+MsdEa9MeoY3LVxALnvPU+SaqdO5amu3H5A2Shtj8RMOKOZhS6GEUjeVhhWck+xkCNjknNsXq8DN3owWmHBhWELn2vW2bHQ1S1o349CuBFfvyngiodOqWEwGiHgm45qLXK1U0NhyJrSGvnBN2Yv0VovFKw2O0P5KLvhjPa56B5uOgnAjDI1VecGD22bmxKsdTYNlvLWXD7KaL2ATzl2H7kquxRCUK4328FyetjbyJYwJaW2gxgZ7UQtBFyankr7UrniVCHtYEK/r1XVHQUCr1swdy1g7Yk042IUxngKuGTJE0P1GQkzubOZ9SMy6nMVQoNhimsFBylQaJEwacYYJWol4JpdQ7P9t0+lnx9VWcKc2+GqeeurQYwcWzPqgNoK+AiKUjJXPI/VvrF9EoNRB4y1gGNjhRcFXPGrTQ+ZNGPUFWMr4IZdU3ziamrySLFLJltsRq0xlgLuOQop69zaRwrvmFlwRtNQh0q2UWDGson9Nkgy7txiNB7jKuAr2ByhI+3DTUMTOJZmMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMhhBRnExEcTIz6utgMBjl4I7y+wshRC+KkykhRDropz1RsgIRQswKIc4H/fSozGMzmo0oTuaEEJNCCDIwHSEErcGDQT/dHPW1NRm3sv+J4mRVCPFWeX9r0E+TEh/gnhDiLl56N+indM6xARRcBwuZlNxPMcaI4oTW1oIQgu7LU8tHZ9kgFBfw/zN8ZnLQTy9yHj87NmnlHSHEQ+WtvUE/pQfcakRxQkKdGhbxeyHE5qCfHosxQRQnXSHEuhDisedXzgb9lO4hIxC36T9wyU0oSwBV4SY8jeJkWbQYUZwsCiEGFgu1IoT4N4qToyhOHon2czyk6L8GCDfhXoWX1X4BR1xsQhmuEblgJmxUSezBembu8VABxbkdoAAPozhZEy0EQrRzIcTzHF+n0I5RgGQjl8kEeihF4XKvSImUKoDgFF4JIe5H8W8aAf9+IkECgbMvqkWehfk6ipOFQT991DKX/LPmrUtJAVKIQs+D/u4N6TMnQohSeKCxjcHhNpk0azTop6dFTgLr6VIUbwb9dC3n4ulAYK+uM4oTindfeh7ir0E/pXiwVBhIS8K8EILINfJa5uCiC8Pin24yEQcPZsfgjpPyo/t+IIR4IHMQFK7Ao6HPrA366UHAOSeKckZtFHDSnE+qEnCcg9IdS7bPDPrprcBjZgshwwchBF3r68DLy6VcHAv7h+atb4N+2tUwyeuWOLMwyTkKINSwPYc/TIJLHgwU4LavgpOU+i9SmoN+Sopl7HHbw4Uuy3Ve9RTYkJhOJe6Wcgg34S08gbJg4hR21RcG/TTF52lh6rAlGgQiCvEcdc/hE7IGRuEmDPrpLnlVgd5L5rHdp6xEW7mMvAJOManJTSwF8AKokMaGh2CdfY5HXsf3cq7u6u8choDb7s20IWZ/XrLyqQx4docaxUvK68Wgny5S8VSIyx0AWUGSNzQxCmK1rgJus5yl5R893SZf1tmmmEJBxTcLJS6IWYunoD0H3PDEIOTLDRFu3bN7QzH4EFzmR7h3JOh/QpFciDFHxqIfWxY+VV2ViQ+uWJzcbxfDDRd9RmOJN/D6sVT6mMI9JmW1DzdOBXEQFPuVsRBtioKY/XWLJV/QFB29bACTrHOJ54eQqbh270RDEf3mbXoK6fqMwpUyBNzEcJPAFCbYcljdSU8rKbOz5K6/dJQ0nkZxMo3FqGOvXxQVcFjorkW5+Xgofwkh/laO263ItS0LdF9lvB+WcDcd0e8QLNXcw3/katMiLvoDw/uHFZRQXpSkBFTFs+pTr0xuG5po/gdBklGGBZjRPCgBcmnFkzjSKYHaWnBDBV4hyzMuiH57ol8NaybLRhQWcJNLWUX9b1lxs5qGCvI0oLhSFFJkuFtCHG66jlPfmBBK4Jvy8lKNSSOd0nqTVRG2AVGcdCilSQKHn25JbrmuAEgtfLKVknsJuMlyabVKQTgtmKeVU4Ulz2Ki0ORAEyNXwaC7MgheMa2oIRD/UgpM5TQGqH9oLKLfQn2BfoKPSP/Rz9coTnJ7Kcj162olZIMjPErJvQT8adVpMgmuEswvnsdRlVJeLafGib2ClmfWkgLsFvR06ly+alrs5HlcNLGRJoqTnxDqrMVZ1yzlXHdRnKwTcUoFZfR5ZBwovlbxadBPZzTpX6/UsQ63HYvZ9IflAh4ypU1s2PA4zoSmkCJPU0xW5iprTWLYizS/2NxobwE3eDFNnbZzF400lfIIcJ1Jmewits0NVMbpsi2hx1mVCN0nCL10HMsHqhMwyIBv2bWWRS+jmUQWPGLAJ+BO9lD0cOmpLE4886W6hX6e41rXQDB+VsKRXhGtaUGogJ4o11XbvC5V5JGlcrR2foQXQ2RjqX8LOhIzpf8U1nU+D5MP5eAjVF9s4STWmNqPcN9gueVahx1VyOnvy0N433GkpIyVYrD8dCO6EJJHlpjd1xPwnfCixrO/ck78eGwQPKoe6+Sswbc9BG83FfdXfTa1HgpBQxkQW57jnuq8sSW47VSMQlayLOie1bwmBPNRFL5dgNYCJFJiWSejBXsaJXBuWDu5BNwGihfoCmWNdlZhA/5+Tvdc17UlPG7+L2hUtdvpLK9nQx6I5aGGPKBzLNr7FWQgKoNUmEHx5j68pOcGa043ispXy661yDCR4zuLGoP03TCwZK4EpbuuMU66sLmTl2SzLeR7IBlkd6Uq4f7u+aB1bm7e4hRT0clmQRdSTXEFA+efaJIFV0EuJeLKB4ammYxpvyKfKriEixJI0mcWS+3ki2AsbNb72PO6c9Vo3MZCMnUyheIdHmb2E6GghG7a/9AO+ofhu75avKuZ61amBSC+oKjraCpOCI0H1ZCntjG4DRSnYninKc1Hgv4jipPjghkMNeuzm+MY6vqiVFaR9WVTylk59TVgPavpMttQytylqi58B0Fla+27dnOo3DKKky+a/vNOTg1bpLRUt+A+l1C9Z/q+90LRMc4VurJDARFeUZxMwnI9MSi0Qc74fErjWh/nuMxjJSyiuoiDAgMmTMTq1XEta201sPHKKuBHjqKWT5ISOMWFFRGsbc0DfuhJbKluq65YwBdVuIU2sjDkWtUCkbM2TCvB9c9Zus+y+JwajkLSapOG53tacG0uWYT0zPY84I3cM7DmrgKgUur4s0KXA8e0EyJCEvxQG17RjqvUUETjs9GCerOLdLuVXi+NWFKbYvFl+nGMu5pa+0YLtwxaQwjZXhmqt14iF+0LnSB3clyaTrBM045cCkiXaqVw2DkiTGfo8pQq33ZYFtI0pU/GwEJdNtTduv6IyRKLP3SKqqgQlTGcoUwisdYgS4bqrQdoyMkr5FNllHgOwsKz4xxr4XNANmSv6Fq/HTpiqESYju2c+lKWi27otS0a5xqtRhECqenxtycR19M8fxJyHyOj8+Tmcl6Obz9CqDEi0N/pa0RUz7qTV8BNrkZlpZFYsHslCEjRqaNqy2jRyj7bw9vxdLPURV7WaKphbW5AM9FO8zSaIPz7ovHsOjmsaTf0/LiGTY/M0pZHyKXL/4cI6VHBhqWrWvQpC8G2WHHLX1qCFSvUxICRyb9KVGo2PuOJq0oK9fpLRQt5RogdXP89VKzlCS10seu6h2utCuWpyI+nBm6g6J59IV6F6p1aJyGZLLitBZEEv8ouIJ0whFrQojPbF5W0SKEY3COGe4IuJd21kHXfyVmfP3LAGDzVlP0ulzCg06c2XD1PGnJe5RqOwA3cKNDxEW6LYQxpwS5MqpKATziqcKrsYJosIe7P7WFg4ampmsK5R49a5vtoH5zQfG+6KZNcAtKOwVVYUGrXKgI9Wk5Vi7cpikNl1U1W3dtQ+bLhOmMRus0XCbgtjqD3Jit00xc0eUVXTH1SNE2GntwbHTvY5aQMa+m7rzptONjFLPEdTTrmQ83nsKkweS95C4dCt5deq4CYnFF+90p1Oog004g0H1gVPikAavhB08+VgHccGvm8QgZXjUd8FvNxnkUA8oeEKYWmf654KvNlbWEEzeszuGIaHsuhhpCh+oPaj0uWUUGeXlXeLuV/LTyIyhlx1SlQHKWr9fgVGIfToE4Zy4ZxUquYxvsvhkn8Q6/fcWiE6QrGJmcXNaOJ13w8BfUz94itNQkDvI9lC1F1YzuhkqCr1tNBV+n0ror6gyHhnabbLzgfDfL32tQTm6HBc866A8tUOIsFvruhmd77I1CmDhRyjdb7KsKPbH+7N6aW7Dse27lWRbLpjvvYo7F9X9PeSWztEhZXNsSOhHbBsQ81CVKoG+gL09/wJ/72V4aHUslmiEPEukbAnXEjrC25rh08t6AtqEj44Z29LnnL4XsF0rLyNBeBQp6jkLZfDNKgjk4Zbz0yK+QBnmZ5cBuqKnYxxSFWtwoCaZoV9xoC/hk3wCTce9jRsirhNgk4zQpPUdAxrRRU7KHjrsnCnVlZarFUScWug+w8h3v51SDczzzOvQr2/c+KJvKIQOG8gLV+hmfbw/MPHU6iVvi5OKrZzAO85dg6uOypGz67jc66bgDce1oMIaA4m865MawteZUthIkw08VPVzFdk7cJtnTDfVSKdShsoUV/CoHuIk2rG6Yg45VHc0aea+yAY7oI2PZ6aLu1OK7DpAiu9SyQgHehNXXzpgoNrsu7f7bPDYSQH3gMoCCy6+2odtnI5tS1vdRUB8xoW1GsS6bIOh6CTTH1YpmZhOi3UFOIlMDaH9imyijbSFXF1/he95Fhpptx++s76M/WvVf1eKBdg4B7CQLidGIPyd1dU+JZyp/uhOwvXRWgTVvTBRYCckmxlXBmyX/i+U45CFV6fmtF9+UyeEs7SuhmK41Ww8WRbcUEBTQFw0YKin4/dq1v20y2Skf0khsexUnWQdSFQgmOTxCzrrehV7qNAEl0iFj0GItzXurVPsK/xC7TtlJVjqXaVIT7EhNeTyvIV1cC3B/ve0Qu+iODtb4c9NO6bpXDYIRa7j0lJHBuVqnhehqX4SAW3WT1ytini8GoA3qKcNOEojkPb1Fd/43ba41icBp0Z5pyyi4vo9GIfpNT8gKncmjfFJoq0I3bfun/AX1ranviWIrgAAAAAElFTkSuQmCC";



// Self-contained transparent base64 PNG signatures to bypass import and asset loading issues

// Helper to asynchronously load image URL to HTML Image for PDF rendering
const loadPhotoHelper = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateGatePassPDF = async (request: LeaveRequest): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 Size (148mm width x 210mm height)
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Draw outer double borders for academic credentials
  doc.setDrawColor(2, 132, 199); // primary-500
  doc.setLineWidth(1.5);
  doc.rect(5, 5, width - 10, height - 10);
  
  doc.setDrawColor(15, 23, 42); // slate-900 thin inner border
  doc.setLineWidth(0.3);
  doc.rect(7, 7, width - 14, height - 14);

  // 2. Header Box
  doc.setFillColor(15, 23, 42); // Slate-900 header
  doc.rect(7.3, 7.3, width - 14.6, 24, 'F');

  // Load IIST Logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadPhotoHelper('/iist-logo.png');
  } catch (e) {
    console.warn("Failed to load IIST logo for PDF:", e);
  }

  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 11, 11.3, 16, 16);
    } catch (e) {
      console.warn("Failed to draw logo inside PDF header:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  
  const textX = logoImg ? 30 : width / 2;
  const textAlign = logoImg ? 'left' : 'center';

  doc.setFontSize(9.5);
  doc.text('INDORE INSTITUTE OF SCIENCE & TECHNOLOGY', textX, 17, { align: textAlign });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('CAMPUS EMERGENCY LEAVE GATE PASS', textX, 24, { align: textAlign });

  // 3. Student Details Block with Prominent LARGEST Photo on left
  const photoX = 12;
  const photoY = 36;
  const photoW = 36;
  const photoH = 36;

  // Outer photo frame
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.5);
  doc.rect(photoX, photoY, photoW, photoH);

  let photoLoaded = false;
  if (request.student?.photo_url) {
    try {
      const imgElement = await loadPhotoHelper(request.student.photo_url);
      if (imgElement) {
        doc.addImage(imgElement, 'JPEG', photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
        photoLoaded = true;
      }
    } catch (e) {
      console.warn("Failed loading student photo for PDF, drawing placeholder.", e);
    }
  }

  // Draw vector placeholder if photo failed or not present
  if (!photoLoaded) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, 'F');
    // Draw avatar head & shoulders
    doc.setFillColor(148, 163, 184); // slate-400
    doc.circle(photoX + (photoW / 2), photoY + 14, 6, 'F');
    doc.ellipse(photoX + (photoW / 2), photoY + 28, 11, 6, 'F');
  }

  // Student details on right of photo
  const detailsX = 53;
  let textY = 43;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('STUDENT NAME:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.full_name || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ROLL NUMBER:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.roll_number || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('DEPARTMENT:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${request.student?.department || 'N/A'}`, detailsX, textY + 4);

  // 4. Leave Details Section: LARGE, BOLD, HIGH CONTRAST BLOCK (Visible at a glance)
  const detailBoxY = 78;
  const detailBoxH = 46;
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.5);
  doc.rect(10, detailBoxY, width - 20, detailBoxH, 'FD');

  let leaveTextY = detailBoxY + 8;
  
  // EMERGENCY CATEGORY
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMERGENCY CATEGORY:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${request.reason_category.toUpperCase()}`, 14, leaveTextY + 5.5);

  leaveTextY += 13;
  // DATE OF LEAVE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATE OF LEAVE:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.text(`${request.requested_date}`, 14, leaveTextY + 5.5);

  // APPROVED TIME WINDOW (Very large and high contrast)
  leaveTextY += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('APPROVED EXIT/RETURN WINDOW:', 14, leaveTextY);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38); // Red-600 for absolute contrast
  doc.text(`${request.time_out}  TO  ${request.time_expected_back || 'END OF DAY (NO RETURN)'}`, 14, leaveTextY + 6);

  // 5. Dual Signatures Section (Side by side for trust)
  const sigsY = 132;
  
  // Faculty signature block (Left) - Clean & transparent layout
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFIED & RECOMMENDED BY', 14, sigsY + 5);
  // Add Faculty Sig image directly (transparent background)
  try {
    doc.addImage(FACULTY_SIG_BASE64, 'PNG', 16, sigsY + 7, 34, 13);
  } catch (e) {
    console.warn("Failed to add faculty signature image to PDF, using text fallback", e);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('[VERIFIED DIGITALLY]', 16, sigsY + 14);
  }
  // Faculty text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Mr. Sharma', 14, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Faculty Advisor', 14, sigsY + 32);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(Confirmed Parent: ${request.faculty_confirmed_parent ? 'YES' : 'NO'})`, 14, sigsY + 35.5);

  // HOD signature block (Right) - Clean & transparent layout
  const hodSigX = 14 + (width - 24) / 2;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('APPROVED & SIGNED BY', hodSigX, sigsY + 5);
  // Add HOD Sig image directly (transparent background)
  try {
    doc.addImage(HOD_SIG_BASE64, 'PNG', hodSigX + 2, sigsY + 7, 34, 13);
  } catch (e) {
    console.warn("Failed to add HOD signature image to PDF, using text fallback", e);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('[APPROVED DIGITALLY]', hodSigX + 2, sigsY + 14);
  }
  // HOD text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Dr. Rao', hodSigX, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('HOD, Computer Science', hodSigX, sigsY + 32);

  // 6. Verification Footer (Below signatures & QR Code)
  const footerY = 178;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(10, footerY - 2, width - 10, footerY - 2);

  // Generate QR Code image for the PDF
  const qrTokenToEncode = request.qr_token || request.id;
  const verifyUrl = `https://campus-pass-nu.vercel.app/verify/${qrTokenToEncode}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });
    doc.addImage(qrDataUrl, 'PNG', width - 36, footerY, 24, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(2, 132, 199);
    doc.text('SCAN TO VERIFY', width - 24, footerY + 26.5, { align: 'center' });
  } catch (e) {
    console.warn('Failed to render QR Code on PDF pass:', e);
  }

  // Pass ID small but readable
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`PASS ID: ${request.pass_id || 'PENDING'}`, (width - 24) / 2 + 5, footerY + 4, { align: 'center' });
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Cryptographically Signed Gate Permit', (width - 24) / 2 + 5, footerY + 8.5, { align: 'center' });

  // System warning footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.text('This permit is a secure digital record. Alteration is a severe academic offense.', (width - 24) / 2 + 5, footerY + 14, { align: 'center' });

  // Output as Blob
  return doc.output('blob');
};
